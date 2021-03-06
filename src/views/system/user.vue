<template>
  <div class="app-container">

    <div class="filter-container">
      <el-input :placeholder="$t('table.realname')" v-model="listQuery.real_name.like" style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter"/>
      <el-select v-model="listQuery.status" :placeholder="$t('table.status')" clearable style="width: 90px" class="filter-item">
        <el-option v-for="(item,key) in statusOptions" :key="key" :label="item" :value="key"/>
      </el-select>
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">{{ $t('table.search') }}</el-button>
      <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreate">{{ $t('table.add') }}</el-button>
    </div>

    <el-table
      v-loading="listLoading"
      :key="tableKey"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%;">

      <el-table-column :label="$t('table.id')" prop="id" sortable align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.id }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('login.username')" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.user_name }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('table.realname')" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.real_name }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('table.email')" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.email }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('table.department')" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.department }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('table.authority')" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.authority }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('table.status')" class-name="status-col">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status | statusFilter">{{ scope.row.status | statusName }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column :label="$t('table.actions')" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button type="primary" size="mini" @click="handleUpdate(scope.row)"><svg-icon icon-class="edit" /></el-button>
          <el-button v-if="scope.row.status===0" size="mini" type="success" @click="handleModifyStatus(scope.row,1)">{{ $t('table.open') }}
          </el-button>
          <el-button v-if="scope.row.status===1" size="mini" type="danger" @click="handleModifyStatus(scope.row,0)">{{ $t('table.stop') }}
          </el-button>
        </template>
      </el-table-column>

      <el-table-column :label="$t('table.create_time')" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.create_time }}</span>
        </template>
      </el-table-column>

    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery._limit.page" :limit.sync="listQuery._limit.size" @pagination="getList" />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="70px" style="width: 400px; margin-left:50px;">

        <el-form-item :label="$t('login.username')" prop="user_name">
          <el-input v-model="temp.user_name"/>
        </el-form-item>

        <el-form-item v-if="dialogStatus==='create'" :label="$t('login.password')" prop="password">
          <el-input v-model="temp.password"/>
        </el-form-item>

        <el-form-item :label="$t('table.realname')" prop="real_name">
          <el-input v-model="temp.real_name"/>
        </el-form-item>

        <el-form-item :label="$t('table.email')" prop="email">
          <el-input v-model="temp.email"/>
        </el-form-item>

        <el-form-item :label="$t('table.department')">
          <el-input v-model="temp.department"/>
        </el-form-item>

        <el-form-item :label="$t('table.status')">
          <el-select v-model="temp.status" class="filter-item" placeholder="Please select">
            <el-option v-for="(item,key) in statusOptions" :key="key" :label="item" :value="key"/>
          </el-select>
        </el-form-item>

      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">{{ $t('table.cancel') }}</el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">{{ $t('table.confirm') }}</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import userApi from '@/api/system/user'
import waves from '@/directive/waves' // Waves directive
import { parseTime } from '@/utils'
import Pagination from '@/components/Pagination' // Secondary package based on el-pagination

export default {
  components: { Pagination },
  directives: { waves },
  filters: {
    statusFilter(status) {
      const statusMap = ['danger', 'success']
      return statusMap[status]
    },
    statusName(status) {
      const statusName = ['stop', 'open']
      return statusName[status]
    }
  },
  data() {
    return {
      tableKey: 0,
      list: [],
      total: 0,
      listLoading: true,
      listQuery: {
        real_name: {
          like: undefined
        },
        status: undefined,
        _limit: {
          page: 1,
          size: 20
        },
        _order: {
          create_time: 'desc'
        }
      },
      statusOptions: ['stop', 'open'],
      temp: {
        id: undefined,
        user_name: '',
        password: '',
        real_name: '',
        email: '',
        department: '',
        status: 1
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: 'Edit',
        create: 'Create'
      },
      rules: {
        user_name: [{ required: true, message: 'user_name is required', trigger: 'blur' }],
        password: [{ required: true, message: 'password is required', trigger: 'blur' }],
        real_name: [{ required: true, message: 'realname is required', trigger: 'change' }],
        email: [{ required: true, message: 'tiemailtle is required', trigger: 'change' }]
      },
      downloadLoading: false
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.listLoading = true
      userApi.fetchList(this.listQuery).then(response => {
        this.total = response.data.total
        this.list = response.data.items
        this.listLoading = false
      })
    },
    handleFilter() {
      this.listQuery._limit.page = 1
      this.getList()
    },
    handleModifyStatus(row, status) {
      row.status = status
      userApi.update(row).then((response) => {
        this.$message({
          message: response.msg,
          type: 'success'
        })
      })
    },
    handleCreate() {
      this.dialogStatus = 'create'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    createData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          delete this.temp.id
          userApi.create(this.temp).then((response) => {
            this.temp.id = response.data
            this.temp.update_time = parseTime(new Date(), '{y}-{m}-{d} {h}:{i}:{s}')
            this.list.unshift(this.temp)
            this.dialogFormVisible = false
            this.$notify({
              title: '成功',
              message: '创建成功',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    handleUpdate(row) {
      this.temp = Object.assign({}, row) // copy obj
      delete this.temp.password
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          const tempData = Object.assign({}, this.temp)
          userApi.update(tempData).then(() => {
            // this.list.splice(this.list.indexOf(item => item.id === this.temp.id), 1, this.temp)
            for (const v of this.list) {
              if (v.id === this.temp.id) {
                const index = this.list.indexOf(v)
                this.list.splice(index, 1, this.temp)
                break
              }
            }
            this.dialogFormVisible = false
            this.$notify({
              title: '成功',
              message: '更新成功',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    }
  }
}
</script>
