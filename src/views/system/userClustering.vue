<template>
  <div class="app-container">

    <div class="filter-container">
      <el-input :placeholder="$t('table.realname')" v-model="listQuery.name.like" style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter"/>
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

      <el-table-column :label="$t('table.name')" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.name }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('table.compute_type')" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.compute_type | computeType }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('table.user_num')" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.last_num }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('table.update_time')" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.update_time }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('table.create_time')" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.create_time }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('table.status')" class-name="status-col">
        <template slot-scope="scope">
          <el-switch v-if="scope.row.status !== undefined" v-model="scope.row.status" active-value="1" inactive-value="0" @change="handleModifyStatus(scope.row)" />
        </template>
      </el-table-column>

      <el-table-column :label="$t('table.actions')" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button type="primary" size="mini" @click="handleUpdate(scope.row)"><svg-icon icon-class="edit" /></el-button>
          <el-button type="primary" size="" @click="click(scope.row)">log</el-button>
        </template>
      </el-table-column>

    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery._limit.page" :limit.sync="listQuery._limit.size" @pagination="getList" />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="70px" style="width: 400px; margin-left:50px;">

        <el-form-item :label="$t('table.name')" prop="name">
          <el-input v-model="temp.name"/>
        </el-form-item>

        <el-form-item :label="$t('table.compute_type')">
          <el-select v-model="temp.compute_type" class="filter-item" placeholder="Please select">
            <el-option v-for="(item,key) in computeType" :key="key" :label="item" :value="key"/>
          </el-select>
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
import userClusteringApi from '@/api/ims/userClustering'
import waves from '@/directive/waves' // Waves directive
import { parseTime } from '@/utils'
import Pagination from '@/components/Pagination' // Secondary package based on el-pagination

export default {
  components: { Pagination },
  directives: { waves },
  filters: {
    computeType(type) {
      const typeName = ['临时查询', '每日任务']
      return typeName[type]
    }
  },
  data() {
    return {
      tableKey: 0,
      list: [],
      total: 0,
      listLoading: true,
      value5: true,
      listQuery: {
        name: {
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
      statusOptions: { '0': '关', '1': '开' },
      computeType: ['临时数据', '每日任务'],
      temp: {
        id: undefined,
        name: '',
        compute_type: 0,
        status: '1'
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: 'Edit',
        create: 'Create'
      },
      rules: {
        name: [{ required: true, message: 'name is required', trigger: 'blur' }]
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
      userClusteringApi.fetchList(this.listQuery).then(response => {
        this.total = response.data.total
        this.list = response.data.items
        this.listLoading = false
      })
    },
    handleFilter() {
      this.listQuery._limit.page = 1
      this.getList()
    },
    handleModifyStatus(row) {
      console.log(row)
      userClusteringApi.update(row).then((response) => {
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
          userClusteringApi.create(this.temp).then((response) => {
            this.temp.id = response.data
            this.temp.create_time = parseTime(new Date(), '{y}-{m}-{d} {h}:{i}:{s}')
            console.log(this.temp)
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
          userClusteringApi.update(tempData).then(() => {
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
    },
    click(row) {
      userClusteringApi.getLog(row).then(response => {
        console.log(response)
        let message = ''
        response.data.forEach(element => {
          message += `<p>${element['create_time']}: ${element['num']}</p>`
        })
        this.$notify({
          title: row.name + ' Log',
          dangerouslyUseHTMLString: true,
          message: message,
          type: 'success'
        })
      })
    }
  }
}
</script>
